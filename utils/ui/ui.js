// UI
// You can design your own playerUI here
class UIModule {
	constructor() {}

	createPlayBtn() {
		let playBar = document.createElement('button');
        playBar.textContent = '>';
        playBar.disabled = true;
        playBar.style.width = '5%';
        playBar.style.marginBottom = '5px';
        playBar.style.marginLeft = '5px';
        playBar.style.color = "white";
        playBar.style.background = "#6666FF";
        playBar.style.border = "0 none";
        playBar.style.textAlign = "center";
        playBar.style.lineHeight = "20px";
        playBar.style.fontWeight = "bold";
        playBar.style.borderRadius = "7px";

        return playBar;
	}

	createControlBar(width, zindex) {
		let controlBar = document.createElement('div');
        controlBar.style.width = width + 'px';
        controlBar.style.right = '0%'
        controlBar.style.bottom = '0%'
        controlBar.style.display = 'block';
        controlBar.style.position = 'absolute';
        controlBar.style.zIndex = zindex;

        return controlBar;
	}

	createStatusBar() {
		let status = document.createElement('div');
        status.style.color = 'white';
        status.textContent = 'Loading...';

        return status;
	}

	createPTSLabel() {
		let ptsLabel = document.createElement('span')
        ptsLabel.style.color = 'white';
        ptsLabel.style.float = 'right';
        ptsLabel.style.marginBottom = '5px';
        ptsLabel.style.marginRight = '5px';
        return ptsLabel;
	}

	createProgress() {
		let progress = document.createElement('progress');
        progress.value = 0;

        // progress.style.borderRadius = '2px';
        // progress.style.borderLeft = '1px #ccc solid';
        // progress.style.borderRight = '1px #ccc solid';
        // progress.style.borderTop = '1px #aaa solid';
        // progress.style.backgroundColor = 'white';
        progress.style.width = '100%';
        // progress.style.marginLeft = '2%';
        // progress.style.setProperty("-webkit-progress-bar",
        //     "background-color(#d7d7d7)");
        // progress.style.setProperty("-webkit-progress-value",
        //     "background-color(#aadd6a)");

        return progress;
	}
}

exports.UI = UIModule;